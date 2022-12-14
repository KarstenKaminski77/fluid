<?php

namespace App\Controller;

use App\Entity\ClinicCommunicationMethods;
use App\Entity\Clinics;
use App\Entity\CommunicationMethods;
use App\Services\PaginationManager;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CommunicationMethodsController extends AbstractController
{
    private $em;
    private $page_manager;
    private $encryptor;
    const ITEMS_PER_PAGE = 10;

    public function __construct(EntityManagerInterface $em, PaginationManager $page_manager, Encryptor $encryptor)
    {
        $this->em = $em;
        $this->page_manager = $page_manager;
        $this->encryptor = $encryptor;
    }

    private function getCommunicationMethods($results)
    {
        $communication_methods = $this->em->getRepository(CommunicationMethods::class)->findByNotInApp();

        $select = '<select name="clinic_communication_methods_form[communicationMethod]" id="communication_methods_type" class="form-control">';
        $select .= '<option value="">Please Select a Communication Method</option>';

        foreach($communication_methods as $method)
        {
            $select .= '<option value="'. $method->getId() .'">'. $method->getMethod() .'</option>';
        }

        $select .= '</select>';

        $response = '
        <div class="row pt-3">
            <div class="col-12 text-center mt-1 pt-3 pb-3">
                <h4 class="text-primary text-truncate">Manage Communication Methods</h4>
                <span class="mb-5 mt-2 text-center text-primary text-sm-start d-none d-sm-inline">
                    Add or remove communication methods from the list below.
                </span>
            </div>
            <!-- Create New -->
            <div class="col-12">
                <a 
                    href="" 
                    class="float-end text-truncate mb-2" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modal_communication_methods" 
                    id="communication_methods_new"
                >
                    <i class="fa-regular fa-square-plus"></i>
                    <span class="zms-1">Create New</span>
                </a>
            </div>
        </div>';

        if($results->count() > 0)
        {
            $response .= '
            <div class="row d-none d-xl-flex  bg-light border-right border-left border-top">
                <div class="col-5 pt-3 pb-3 text-primary fw-bold">
                    Method
                </div>
                <div class="col-5 pt-3 pb-3 text-primary fw-bold">
                    Send To
                </div>
                <div class="col-2 pt-3 pb-3 text-primary fw-bold">
    
                </div>
            </div>';

            $i = 0;

            foreach ($results as $method)
            {
                $mobile_no = 0;
                $borderTop = '';
                $i++;

                $col = 10;

                if (!empty($method->getSendTo()))
                {
                    $col = 5;
                }

                if ($method->getCommunicationMethod()->getId() == 3)
                {
                    $mobile_no = $this->encryptor->decrypt($method->getSendTo());
                }
                else
                {
                    $mobile_no = 0;
                }

                if($i == 1)
                {
                    $borderTop = 'border-top';
                }

                $response .= '
                <div class="row t-row '. $borderTop .'">
                    <div class="col-4 col-sm-2 d-xl-none  t-cell text-truncate border-list pt-3 pb-3">Method</div>
                    <div class="col-8 col-sm-10 col-xl-' . $col . '  t-cell text-truncate border-list pt-3 pb-3">
                        ' . $method->getCommunicationMethod()->getMethod() . '
                    </div>';

                if (!empty($method->getSendTo()))
                {
                    $response .= '
                    <div class="col-4 col-sm-2 d-xl-none  t-cell text-truncate border-list pt-3 pb-3">Send To</div>
                    <div class="col-8 col-sm-10 col-xl-5  t-cell text-truncate border-list pt-3 pb-3">
                        ' . $this->encryptor->decrypt($method->getSendTo()) . '
                    </div>';
                }

                $response .= '
                    <div class="col-12 col-xl-2 t-cell text-truncate pt-3 pb-3" id="">
                        <a href="" 
                            class="float-end communication_method_update" 
                            data-communication-method-id="' . $method->getCommunicationMethod()->getId() . '"
                            data-clinic-communication-method-id="' . $method->getId() . '"
                            data-mobile-no="' . $mobile_no . '"
                            data-bs-toggle="modal" 
                            data-bs-target="#modal_communication_methods"
                        >
                            <i class="fa-solid fa-pen-to-square edit-icon"></i>
                        </a>
                        <a 
                            href="" 
                            class="delete-icon float-start float-sm-end method-delete" 
                            data-bs-toggle="modal" data-clinic-communication-method-id="' . $method->getId() . '" 
                            data-bs-target="#modal_method_delete"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </a>
                    </div>
                </div>';
            }

            $response .= '
                    </div>
                </div>
        
                <!-- Modal Manage Communication Methods -->
                <div class="modal fade" id="modal_communication_methods" tabindex="-1" aria-labelledby="communication_methods_modal_label" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content">
                            <form name="form_communication_methods" id="form_communication_methods" method="post">
                                <input type="hidden" value="0" name="clinic_communication_methods_form[clinic_communication_method_id]" id="communication_method_id">
                                <input type="hidden" value="0" name="clinic_communication_methods_form[mobile]" id="mobile_no">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="communication_methods_modal_label">Create a Communication Method</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row mb-3">
                                        <div class="col-12 col-sm-6" id="col_communication_method">
                                            <label>Method</label>xxxx
                                            ' . $select . '
                                            <div class="hidden_msg" id="error_communication_method">
                                                Required Field
                                            </div>
                                        </div>
            
                                        <div class="col-12 col-sm-6" id="col_send_to">
                                            <label id="label_send_to">
                                            </label>
                                            <span id="send_to_container">
                                            <input 
                                                type="text" 
                                                name="clinic_communication_methods_form[sendTo]" 
                                                id="send_to"
                                                class="form-control"
                                            >
                                            </span>
                                            <div class="hidden_msg" id="error_send_to">
                                                Required Field
                                            </div>
                                            <div class="hidden_msg" id="error_communication_method_mobile">
                                                Invalid Number
                                            </div>
                                        </div>
            
                                    </div>
            
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary w-sm-100" data-bs-dismiss="modal">CANCEL</button>
                                    <button type="submit" id="btn_save_communication_method" class="btn btn-primary w-sm-100">
                                        CREATE
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
        
                <!-- Modal Delete Communication Method -->
                <div class="modal fade" id="modal_method_delete" tabindex="-1" aria-labelledby="method_delete_label" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="method_delete_label">Delete Communication Method</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-12 mb-0">
                                        Are you sure you would like to delete this communication method? This action cannot be undone.
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                                <button 
                                    type="button" 
                                    class="btn btn-danger btn-sm communication-method-delete" 
                                    id="delete_method">DELETE</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>';
        }
        else
        {
            $response .= '
            <div class="row border-left border-right border-top border-bottom bg-light">
                <div class="col-12 text-center mt-3 mb-3 pt-3 pb-3 text-center">
                    You don\'t have any communication methods saved. 
                </div>
            </div>
            <!-- Modal Manage Communication Methods -->
            <div class="modal fade" id="modal_communication_methods" tabindex="-1" aria-labelledby="communication_methods_modal_label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <form name="form_communication_methods" id="form_communication_methods" method="post">
                            <input type="hidden" value="0" name="clinic_communication_methods_form[clinic_communication_method_id]" id="communication_method_id">
                            <input type="hidden" value="0" name="clinic_communication_methods_form[mobile]" id="mobile_no">
                            <div class="modal-header">
                                <h5 class="modal-title" id="communication_methods_modal_label">Create a Communication Method</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-12" id="col_communication_method">
                                        <label>Method</label>
                                        ' . $select . '
                                        <div class="hidden_msg" id="error_communication_method">
                                            Required Field
                                        </div>
                                    </div>
        
                                    <div class="col-6" id="col_send_to">
                                        <label id="label_send_to">
                                        </label>
                                        <span id="send_to_container">
                                        <input 
                                            type="text" 
                                            name="clinic_communication_methods_form[sendTo]" 
                                            id="send_to"
                                            class="form-control"
                                        >
                                        </span>
                                        <div class="hidden_msg" id="error_send_to">
                                            Required Field
                                        </div>
                                        <div class="hidden_msg" id="error_communication_method_mobile">
                                            Invalid Number
                                        </div>
                                    </div>
        
                                </div>
        
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary w-sm-100" data-bs-dismiss="modal">CANCEL</button>
                                <button type="submit" id="btn_save_communication_method" class="btn btn-primary w-sm-100">
                                    CREATE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>';
        }

        return $response;
    }

    #[Route('/clinics/get-communication_methods', name: 'get_communication_methods')]
    public function getCommunicationMethodsAction(Request $request): Response
    {
        $permissions = json_decode($request->request->get('permissions'), true);

        if(!in_array(13, $permissions))
        {
            $html = '
            <div class="row mt-3 mt-md-5">
                <div class="col-12 text-center">
                    <i class="fa-solid fa-ban pe-2" style="font-size: 30vh; margin-bottom: 30px; color: #CCC;text-align: center"></i>
                </div>
            </div>
            <div class="row">
                <div class="col-12 text-center">
                    <h1>Access Denied</h1>

                        <p class="mt-4">
                            Your user account does not have permission to view the requested page.
                        </p>
                </div>
            </div>';

            $response = [
                'html' => $html,
                'pagination' => ''
            ];

            return new JsonResponse($response);
        }

        $page_id = $request->request->get('page_id') ?? 1;
        $methods = $this->em->getRepository(ClinicCommunicationMethods::class)->findByClinic($this->getUser()->getClinic()->getId());
        $results = $this->page_manager->paginate($methods[0], $request, self::ITEMS_PER_PAGE);
        $pagination = $this->getPagination($page_id, $results);
        $html = $this->getCommunicationMethods($results);

        $response = [
            'html' => $html,
            'pagination' => $pagination
        ];
        
        return new JsonResponse($response);
    }

    #[Route('/clinics/get-method', name: 'get_communication_method')]
    public function getMethodAction(Request $request): Response
    {

        $method = $this->em->getRepository(ClinicCommunicationMethods::class)->find($request->request->get('id'));

        // If mobile remove intl dialing code
        if($method->getCommunicationMethod()->getId() == 3){

            $offset = strlen($this->encryptor->decrypt($method->getIntlCode()));

            $send_to = substr($this->encryptor->decrypt($method->getSendTo()), $offset);

        } else {

            $send_to = $this->encryptor->decrypt($method->getSendTo());
        }

        $response = [

            'id' => $method->getId(),
            'method_id' => $method->getCommunicationMethod()->getId(),
            'method' => $method->getCommunicationMethod()->getMethod(),
            'send_to' => $send_to,
            'iso_code' => $this->encryptor->decrypt($method->getIsoCode()),
        ];

        return new JsonResponse($response);
    }

    #[Route('/clinics/manage-communication-methods', name: 'manage_communication_methods')]
    public function manageCommunicationMethodsAction(Request $request): Response
    {
        $data = $request->request->get('clinic_communication_methods_form');
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $communication_method_repo = $this->em->getRepository(CommunicationMethods::class)->find($data['communicationMethod']);
        $method_id = (int) $data['clinic_communication_method_id'];

        if($data['clinic_communication_method_id'] == 0) {

            $clinic_communication_method = new ClinicCommunicationMethods();

        } else {

            $clinic_communication_method = $this->em->getRepository(ClinicCommunicationMethods::class)->find($method_id);
        }

        $clinic_communication_method->setClinic($clinic);
        $clinic_communication_method->setCommunicationMethod($communication_method_repo);
        $clinic_communication_method->setIsDefault(0);

        if((int) $data['mobile'] == 0) {

            $clinic_communication_method->setSendTo($this->encryptor->encrypt($data['sendTo']));

        } else {

            $clinic_communication_method->setSendTo($this->encryptor->encrypt($data['mobile']));
            $clinic_communication_method->setIsoCode($this->encryptor->encrypt($data['iso_code']));
            $clinic_communication_method->setIntlCode($this->encryptor->encrypt($data['intl_code']));
        }

        $clinic_communication_method->setIsActive(1);

        $this->em->persist($clinic_communication_method);
        $this->em->flush();

        $page_id = $request->request->get('page_id') ?? 1;
        $methods = $this->em->getRepository(ClinicCommunicationMethods::class)->findByClinic($this->getUser()->getClinic()->getId());
        $results = $this->page_manager->paginate($methods[0], $request, self::ITEMS_PER_PAGE);
        $pagination = $this->getPagination($page_id, $results);
        $communication_methods = $this->getCommunicationMethods($results);

        $response = [
            'flash' => '<b><i class="fas fa-check-circle"></i> Communication Method successfully created.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>',
            'communication_methods' => $communication_methods,
            'pagination' => $pagination
        ];

        return new JsonResponse($response);
    }

    #[Route('/clinics/method/delete', name: 'communication_method_delete')]
    public function clinicDeleteMethod(Request $request): Response
    {
        $method_id = $request->request->get('id');
        $method = $this->em->getRepository(ClinicCommunicationMethods::class)->find($method_id);

        $method->setIsActive(0);

        $this->em->persist($method);
        $this->em->flush();

        $methods = $this->em->getRepository(ClinicCommunicationMethods::class)->findByClinic($this->getUser()->getClinic()->getId());
        $results = $this->page_manager->paginate($methods[0], $request, self::ITEMS_PER_PAGE);

        $communication_methods = $this->getCommunicationMethods($results);

        $flash = '<b><i class="fas fa-check-circle"></i> Communication method successfully deleted.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        $response = [

            'flash' => $flash,
            'communication_methods' => $communication_methods,
        ];

        return new JsonResponse($response);
    }

    public function getPagination($page_id, $results)
    {
        $current_page = $page_id;
        $last_page = $this->page_manager->lastPage($results);
        $pagination = '';

        if(count($results) > 0) {

            $pagination .= '
            <!-- Pagination -->
            <div class="row">
                <div class="col-12">';

            if ($last_page > 1) {

                $previous_page_no = $current_page - 1;
                $url = '/clinics/communication-methods';
                $previous_page = $url;

                $pagination .= '
                <nav class="custom-pagination">
                    <ul class="pagination justify-content-center">
                ';

                $disabled = 'disabled';
                $data_disabled = 'true';

                // Previous Link
                if ($current_page > 1) {

                    $disabled = '';
                    $data_disabled = 'false';
                }

                $pagination .= '
                <li class="page-item ' . $disabled . '">
                    <a class="ccm-pagination" aria-disabled="' . $data_disabled . '" data-page-id="' . $current_page - 1 . '" href="' . $previous_page . '">
                        <span aria-hidden="true">&laquo;</span> <span class="d-none d-sm-inline">Previous</span>
                    </a>
                </li>';

                $is_active = false;

                for ($i = 1; $i <= $last_page; $i++) {

                    $active = '';

                    if ($i == (int)$current_page) {

                        $active = 'active';
                        $is_active = true;
                    }

                    // Go to previous page if all records for a page have been deleted
                    if(!$is_active && $i == count($results)){

                        $active = 'active';
                    }

                    $pagination .= '
                    <li class="page-item ' . $active . '">
                        <a class="ccm-pagination" data-page-id="' . $i . '" href="' . $url . '">' . $i . '</a>
                    </li>';
                }

                $disabled = 'disabled';
                $data_disabled = 'true';

                if ($current_page < $last_page) {

                    $disabled = '';
                    $data_disabled = 'false';
                }

                $pagination .= '
                <li class="page-item ' . $disabled . '">
                    <a class="ccm-pagination" aria-disabled="' . $data_disabled . '" data-page-id="' . $current_page + 1 . '" href="' . $url . '">
                        <span class="d-none d-sm-inline">Next</span> <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>';

                if(count($results) < $current_page){

                    $current_page = count($results);
                }

                $pagination .= '
                        </ul>
                    </nav>
                    <input type="hidden" id="page_no" value="' . $current_page . '">
                </div>';
            }
        }

        return $pagination;
    }
}
